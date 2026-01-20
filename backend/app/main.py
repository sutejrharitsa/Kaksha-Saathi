from fastapi import FastAPI, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from datetime import datetime, timedelta
import os

from fastapi.middleware.cors import CORSMiddleware

from app.models.quiz_template import QuizTemplate
from app.models.quiz_template_question import QuizTemplateQuestion

from app.models.contest_template import ContestTemplate
from app.models.contest_template_question import ContestTemplateQuestion
from app.models.contest_template_test_case import ContestTemplateTestCase

from app.schemas.contest_template import (
    ContestTemplateCreate,
    ContestTemplateSummary,
    ContestTemplateDetail
)


from app.schemas.doubt import DoubtCreate, DoubtListResponse
from app.models.doubt import (
    create_doubt,
    get_doubts_for_classroom,
    delete_doubt,
    clear_all_doubts
)

from app.models.quiz_template import QuizTemplate
from app.models.quiz_template_question import QuizTemplateQuestion
from app.schemas.quiz_template import (
    QuizTemplateCreate,
    QuizTemplateSummary,
    QuizTemplateDetail
)
from app.models.contest import Contest
from app.models.contest_test_case import ContestTestCase


from app.database import engine, Base, SessionLocal
from app.models import user as user_model
from app.models import user

from app.schemas.user import UserCreate, UserResponse
from app.schemas.classroom import (
    ClassroomCreate,
    ClassroomResponse,
    ClassroomJoin,
    ClassroomStudentsResponse,
)
from app.schemas.quiz import (
    QuizCreateWithQuestions,
    QuizSubmissionCreate,
    QuizQuestionStudent,
)
from app.schemas.contest import (
    ContestCreate,
    ContestSubmissionCreate,
    ContestRunCreate,
)

from app.models.classroom import (
    create_or_get_classroom,
    join_classroom,
    leave_classroom,
    end_classroom,
    get_students_in_classroom,
    get_classroom_leaderboard,
)

from app.models.quiz import (
    create_or_update_quiz_with_questions,
    start_quiz,
    delete_quiz,
)

from app.models.quiz_question import get_active_quiz_questions_for_student
from app.models.quiz_submission import submit_quiz_and_score

from app.models.contest import (
    create_or_update_contest,
    start_contest,
    delete_contest,
    get_contest_question_for_student,
    get_sample_test_cases_for_student,
    submit_contest_solution,
    run_custom_test_case,
)

from typing import List

# --------------------------------------------------
# APP + DB
# --------------------------------------------------

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "https://kaksha-saathi.vercel.app",  # production domain
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --------------------------------------------------
# JWT (ADDED)
# --------------------------------------------------

JWT_SECRET = os.getenv("JWT_SECRET", "dev-secret")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
security = HTTPBearer()

def create_access_token(data: dict, expires_minutes: int = 60):
    payload = data.copy()
    payload["exp"] = datetime.utcnow() + timedelta(minutes=expires_minutes)
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("user_id")
        role = payload.get("role")
        if user_id is None or role is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    current_user = db.query(user.User).filter(user.User.id == user_id).first()
    if not current_user:
        raise HTTPException(status_code=401, detail="User not found")

    return current_user

# --------------------------------------------------
# AUTH
# --------------------------------------------------

@app.post("/login", response_model=UserResponse)
def login(user_data: UserCreate, db: Session = Depends(get_db)):
    user_obj = user_model.login_or_create_user(
        db=db,
        name=user_data.name,
        email=user_data.email,
        role=user_data.role,
    )

    token = create_access_token(
        {"user_id": user_obj.id, "role": user_obj.role}
    )

    return {
        "id": user_obj.id,            # still useful once, at login
        "name": user_obj.name,
        "email": user_obj.email,
        "role": user_obj.role,
        "access_token": token,
    }

# --------------------------------------------------
# CLASSROOM
# --------------------------------------------------

@app.post("/classrooms/create", response_model=ClassroomResponse)
def create_classroom_api(
    data: ClassroomCreate,
    current_user: user.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        classroom = create_or_get_classroom(
            db=db,
            teacher_id=current_user.id,
            room_name=data.room_name,
            password=data.password,
        )
        return {
            "id": classroom.id,
            "room_name": data.room_name,
            "room_code": classroom.room_code,
            "is_active": classroom.is_active,
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/classrooms/join")
def join_classroom_api(
    data: ClassroomJoin,
    current_user: user.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        classroom = join_classroom(
            db=db,
            student_id=current_user.id,
            room_code=data.room_code,
            password=data.password,
        )
        return {
            "message": "Joined classroom successfully",
            "classroom_id": classroom.id,
            "room_code": classroom.room_code,
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/classrooms/leave")
def leave_classroom_api(
    current_user: user.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        leave_classroom(db=db, student_id=current_user.id)
        return {"message": "Left classroom successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/classrooms/end")
def end_classroom_api(
    current_user: user.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        end_classroom(db=db, teacher_id=current_user.id)
        return {"message": "Classroom ended successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/classrooms/students", response_model=ClassroomStudentsResponse)
def list_students_api(
    current_user: user.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        classroom_id, students = get_students_in_classroom(
            db=db,
            teacher_id=current_user.id,
        )
        return {
            "classroom_id": classroom_id,
            "students": [
                {
                    "id": u.id,
                    "name": u.name,
                    "email": u.email,
                    "score": score,
                }
                for u, score in students
            ],
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/classrooms/leaderboard")
def classroom_leaderboard_api(
    current_user: user.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        classroom_id, leaderboard = get_classroom_leaderboard(
            db=db,
            teacher_id=current_user.id,
        )
        return {
            "classroom_id": classroom_id,
            "leaderboard": leaderboard,
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

# --------------------------------------------------
# QUIZ
# --------------------------------------------------

@app.post("/quizzes/create")
def create_quiz_api(
    data: QuizCreateWithQuestions,
    current_user: user.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        quiz_id, count = create_or_update_quiz_with_questions(
            db=db,
            teacher_id=current_user.id,
            questions=data.questions,
        )
        return {"quiz_id": quiz_id, "questions_added": count}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/quizzes/start")
def start_quiz_api(
    current_user: user.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        quiz_id = start_quiz(db=db, teacher_id=current_user.id)
        return {"message": "Quiz started", "quiz_id": quiz_id}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/quizzes/active", response_model=List[QuizQuestionStudent])
def get_active_quiz_api(
    current_user: user.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        _, questions = get_active_quiz_questions_for_student(
            db=db, student_id=current_user.id
        )
        return questions
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/quizzes/submit")
def submit_quiz_api(
    data: QuizSubmissionCreate,
    current_user: user.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        score = submit_quiz_and_score(
            db=db,
            student_id=current_user.id,
            answers=data.answers,
        )
        return {"message": "Quiz submitted successfully", "score": score}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.delete("/quizzes/delete")
def delete_quiz_api(
    current_user: user.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        delete_quiz(db=db, teacher_id=current_user.id)
        return {"message": "Quiz deleted successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

# --------------------------------------------------
# CONTEST
# --------------------------------------------------

@app.post("/contests/create")
def create_contest_api(
    data: ContestCreate,
    current_user: user.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        contest_id = create_or_update_contest(db, current_user.id, data)
        return {"contest_id": contest_id}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/contests/start")
def start_contest_api(
    current_user: user.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        contest_id = start_contest(db, current_user.id)
        return {"contest_id": contest_id}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.delete("/contests/delete")
def delete_contest_api(
    current_user: user.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        delete_contest(db, current_user.id)
        return {"message": "Contest deleted"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/contests/question")
def get_contest_question_api(
    current_user: user.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        return get_contest_question_for_student(db, current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/contests/sample-tests")
def get_sample_tests_api(
    current_user: user.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        return get_sample_test_cases_for_student(db, current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/contests/run")
def run_custom_test_api(
    data: ContestRunCreate,
    current_user: user.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        return run_custom_test_case(
            db=db,
            student_id=current_user.id,
            source_code=data.source_code,
            language_id=data.language_id,
            custom_input=data.input_data,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/contests/submit")
def submit_contest_api(
    data: ContestSubmissionCreate,
    current_user: user.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        score = submit_contest_solution(
            db=db,
            student_id=current_user.id,
            source_code=data.source_code,
            language_id=data.language_id,
        )
        return {"score": score}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

# --------------------------------------------------
# HEALTH
# --------------------------------------------------

@app.get("/")
def health_check():
    return {"status": "Backend is running"}

from app.models.classroom import get_classroom_leaderboard_for_student

@app.get("/classrooms/leaderboard/student")
def classroom_leaderboard_student_api(
    current_user: user.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    print("ROLE FROM DB:", current_user.role)

    # 🔒 Explicit role guard FIRST
    if current_user.role != "student":
        raise HTTPException(
            status_code=403,
            detail="Only students can view student leaderboard"
        )

    try:
        classroom_id, leaderboard = get_classroom_leaderboard_for_student(
            db=db,
            student_id=current_user.id
        )

        return {
            "classroom_id": classroom_id,
            "leaderboard": leaderboard
        }

    except ValueError as e:
        # These are logical errors (e.g. not in classroom)
        raise HTTPException(status_code=400, detail=str(e))



from app.models.quiz import deactivate_quiz

@app.post("/quizzes/deactivate")
def deactivate_quiz_api(
    current_user: user.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        quiz_id = deactivate_quiz(db=db, teacher_id=current_user.id)
        return {
            "message": "Quiz deactivated successfully",
            "quiz_id": quiz_id
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

from app.models.contest import deactivate_contest

@app.post("/contests/deactivate")
def deactivate_contest_api(
    current_user: user.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        contest_id = deactivate_contest(db=db, teacher_id=current_user.id)
        return {
            "message": "Contest deactivated successfully",
            "contest_id": contest_id
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


from app.models.quiz import get_quiz_submissions_overview





@app.post("/doubts/create")
def create_doubt_api(
    data: DoubtCreate,
    current_user: user.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        doubt_id = create_doubt(
            db=db,
            student_id=current_user.id,
            content=data.content
        )
        return {"doubt_id": doubt_id}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/doubts", response_model=DoubtListResponse)
def get_doubts_api(
    current_user: user.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        classroom_id, doubts = get_doubts_for_classroom(
            db=db,
            user_id=current_user.id
        )
        return {
            "classroom_id": classroom_id,
            "doubts": doubts
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.delete("/doubts/{doubt_id}")
def delete_doubt_api(
    doubt_id: int,
    current_user: user.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        delete_doubt(
            db=db,
            teacher_id=current_user.id,
            doubt_id=doubt_id
        )
        return {"message": "Doubt deleted"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.delete("/doubts")
def clear_doubts_api(
    current_user: user.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        clear_all_doubts(
            db=db,
            teacher_id=current_user.id
        )
        return {"message": "All doubts cleared"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

from sqlalchemy.orm import Session
from app.models.user import User
from app.models.quiz import Quiz
from app.models.contest import Contest

from app.models.classroom import get_classroom_status

@app.get("/classrooms/status")
def classroom_status_api(
    current_user: user.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        return get_classroom_status(
            db=db,
            user_id=current_user.id
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


from app.models.classroom import Classroom
from app.models.user import User

@app.get("/classrooms/info")
def classroom_info_api(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        # Resolve classroom based on role
        if current_user.role == "student":
            if current_user.current_classroom_id is None:
                raise ValueError("User is not in a classroom")

            classroom = (
                db.query(Classroom)
                .filter(Classroom.id == current_user.current_classroom_id)
                .first()
            )

        elif current_user.role == "teacher":
            classroom = (
                db.query(Classroom)
                .filter(Classroom.teacher_id == current_user.id)
                .first()
            )

            if not classroom:
                raise ValueError("Teacher has no active classroom")

        else:
            raise ValueError("Invalid user role")

        teacher = (
            db.query(User)
            .filter(User.id == classroom.teacher_id)
            .first()
        )

        return {
            "classroom_id": classroom.id,
            "room_code": classroom.room_code,
            "teacher_name": teacher.name
        }

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
from app.models.quiz_submission import get_active_quiz_submissions_overview

@app.get("/quizzes/submissions")
def quiz_submissions_overview_api(
    current_user: user.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        return get_active_quiz_submissions_overview(
            db=db,
            teacher_id=current_user.id
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

from app.models.contest import get_active_contest_submissions_overview

@app.get("/contests/submissions")
def contest_submissions_overview_api(
    current_user: user.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        return get_active_contest_submissions_overview(
            db=db,
            teacher_id=current_user.id
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/quiz-templates/create")
def create_quiz_template_api(
    data: QuizTemplateCreate,
    current_user: user.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers allowed")

    template = QuizTemplate(
        teacher_id=current_user.id,
        title=data.title
    )
    db.add(template)
    db.commit()
    db.refresh(template)

    questions = [
        QuizTemplateQuestion(
            quiz_template_id=template.id,
            question_text=q.question_text,
            option_a=q.option_a,
            option_b=q.option_b,
            option_c=q.option_c,
            option_d=q.option_d,
            correct_option=q.correct_option
        )
        for q in data.questions
    ]

    db.add_all(questions)
    db.commit()

    return {
        "template_id": template.id,
        "questions_added": len(questions)
    }

@app.get("/quiz-templates", response_model=list[QuizTemplateSummary])
def list_quiz_templates_api(
    current_user: user.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers allowed")

    templates = (
        db.query(QuizTemplate)
        .filter(QuizTemplate.teacher_id == current_user.id)
        .all()
    )

    return [
        {"id": t.id, "title": t.title}
        for t in templates
    ]

@app.get("/quiz-templates/{template_id}", response_model=QuizTemplateDetail)
def get_quiz_template_api(
    template_id: int,
    current_user: user.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    template = (
        db.query(QuizTemplate)
        .filter(
            QuizTemplate.id == template_id,
            QuizTemplate.teacher_id == current_user.id
        )
        .first()
    )

    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    questions = (
        db.query(QuizTemplateQuestion)
        .filter(QuizTemplateQuestion.quiz_template_id == template.id)
        .all()
    )

    return {
        "id": template.id,
        "title": template.title,
        "questions": questions
    }

@app.delete("/contest-templates/{template_id}")
def delete_contest_template(
    template_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    template = (
        db.query(ContestTemplate)
        .filter(
            ContestTemplate.id == template_id,
            ContestTemplate.teacher_id == current_user.id
        )
        .first()
    )

    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    db.delete(template)
    db.commit()

    return {"message": "Contest template deleted"}




@app.delete("/quiz-templates/{template_id}")
def delete_quiz_template_api(
    template_id: int,
    current_user: user.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    template = (
        db.query(QuizTemplate)
        .filter(
            QuizTemplate.id == template_id,
            QuizTemplate.teacher_id == current_user.id
        )
        .first()
    )

    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    db.delete(template)
    db.commit()

    return {"message": "Quiz template deleted"}

from app.models.quiz import Quiz
from app.models.quiz_question import QuizQuestion
@app.post("/quiz-templates/{template_id}/activate")
def activate_quiz_template_api(
    template_id: int,
    current_user: user.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # 1. Only teachers
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers allowed")

    # 2. Fetch template (ownership enforced)
    template = (
        db.query(QuizTemplate)
        .filter(
            QuizTemplate.id == template_id,
            QuizTemplate.teacher_id == current_user.id
        )
        .first()
    )

    if not template:
        raise HTTPException(status_code=404, detail="Quiz template not found")

    # 3. Resolve classroom (TEACHER RULE)
    classroom = (
        db.query(Classroom)
        .filter(Classroom.teacher_id == current_user.id)
        .first()
    )

    if not classroom:
        raise HTTPException(status_code=400, detail="No active classroom")

    # 4. Ensure no quiz already exists
    existing_quiz = (
        db.query(Quiz)
        .filter(Quiz.classroom_id == classroom.id)
        .first()
    )

    if existing_quiz:
        raise HTTPException(
            status_code=400,
            detail="Quiz already exists for this classroom"
        )

    # 5. Create quiz
    quiz = Quiz(classroom_id=classroom.id)
    db.add(quiz)
    db.commit()
    db.refresh(quiz)

    # 6. Copy questions
    template_questions = (
        db.query(QuizTemplateQuestion)
        .filter(QuizTemplateQuestion.quiz_template_id == template.id)
        .all()
    )

    if not template_questions:
        raise HTTPException(
            status_code=400,
            detail="Template has no questions"
        )

    quiz_questions = [
        QuizQuestion(
            quiz_id=quiz.id,
            question_text=q.question_text,
            option_a=q.option_a,
            option_b=q.option_b,
            option_c=q.option_c,
            option_d=q.option_d,
            correct_option=q.correct_option
        )
        for q in template_questions
    ]

    db.add_all(quiz_questions)
    db.commit()

    return {
        "message": "Quiz created from template",
        "quiz_id": quiz.id,
        "questions_copied": len(quiz_questions)
    }

from app.schemas.contest_template import ContestTemplateCreate

@app.post("/contest-templates/create")
def create_contest_template(
    data: ContestTemplateCreate,
    current_user=Depends(get_current_user),
    db=Depends(get_db),
):
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers allowed")

    template = ContestTemplate(
        teacher_id=current_user.id,
        title=data.title
    )
    db.add(template)
    db.commit()
    db.refresh(template)

    question = ContestTemplateQuestion(
        contest_template_id=template.id,
        title=data.title,
        description=data.description,
        input_format=data.input_format,
        output_format=data.output_format,
        constraints=data.constraints,
        time_limit_ms=data.time_limit_ms,
        memory_limit_kb=data.memory_limit_kb
    )
    db.add(question)
    db.commit()
    db.refresh(question)

    test_cases = [
        ContestTemplateTestCase(
            contest_template_question_id=question.id,
            input_data=tc.input_data,
            expected_output=tc.expected_output,
            is_sample=tc.is_sample
        )
        for tc in data.test_cases
    ]

    if not any(tc.is_sample is False for tc in test_cases):
        raise HTTPException(
            status_code=400,
            detail="At least one hidden test case required"
        )

    db.add_all(test_cases)
    db.commit()

    return {
        "template_id": template.id,
        "test_cases_added": len(test_cases)
    }

@app.get("/contest-templates", response_model=list[ContestTemplateSummary])
def list_contest_templates_api(
    current_user: user.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers allowed")

    templates = (
        db.query(ContestTemplate)
        .filter(ContestTemplate.teacher_id == current_user.id)
        .all()
    )

    return [{"id": t.id, "title": t.title} for t in templates]

from app.models.contest_question import ContestQuestion


@app.get("/contest-templates/{template_id}", response_model=ContestTemplateDetail)
def get_contest_template_api(
    template_id: int,
    current_user: user.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    template = (
        db.query(ContestTemplate)
        .filter(
            ContestTemplate.id == template_id,
            ContestTemplate.teacher_id == current_user.id
        )
        .first()
    )

    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    question = (
        db.query(ContestTemplateQuestion)
        .filter(ContestTemplateQuestion.contest_template_id == template.id)
        .first()
    )

    test_cases = (
        db.query(ContestTemplateTestCase)
        .filter(
            ContestTemplateTestCase.contest_template_question_id == question.id
        )
        .all()
    )

    return {
        "id": template.id,
        "title": template.title,
        "question_title": question.title,
        "description": question.description,
        "input_format": question.input_format,
        "output_format": question.output_format,
        "constraints": question.constraints,
        "time_limit_ms": question.time_limit_ms,
        "memory_limit_kb": question.memory_limit_kb,
        "test_cases": test_cases
    }

@app.post("/contest-templates/{template_id}/activate")
def activate_contest_template_api(
    template_id: int,
    current_user: user.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers allowed")

    template = (
        db.query(ContestTemplate)
        .filter(
            ContestTemplate.id == template_id,
            ContestTemplate.teacher_id == current_user.id
        )
        .first()
    )
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    classroom = (
        db.query(Classroom)
        .filter(Classroom.teacher_id == current_user.id)
        .first()
    )
    if not classroom:
        raise HTTPException(status_code=400, detail="No active classroom")

    existing = (
        db.query(Contest)
        .filter(Contest.classroom_id == classroom.id)
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=400,
            detail="Contest already exists for classroom"
        )

    contest = Contest(classroom_id=classroom.id)
    db.add(contest)
    db.commit()
    db.refresh(contest)

    template_question = (
        db.query(ContestTemplateQuestion)
        .filter(ContestTemplateQuestion.contest_template_id == template.id)
        .first()
    )

    question = ContestQuestion(
        contest_id=contest.id,
        title=template_question.title,
        description=template_question.description,
        input_format=template_question.input_format,
        output_format=template_question.output_format,
        constraints=template_question.constraints,
        time_limit_ms=template_question.time_limit_ms,
        memory_limit_kb=template_question.memory_limit_kb
    )
    db.add(question)
    db.commit()
    db.refresh(question)

    template_tests = (
        db.query(ContestTemplateTestCase)
        .filter(
            ContestTemplateTestCase.contest_template_question_id
            == template_question.id
        )
        .all()
    )

    test_cases = [
        ContestTestCase(
            contest_question_id=question.id,
            input_data=tc.input_data,
            expected_output=tc.expected_output,
            is_sample=tc.is_sample
        )
        for tc in template_tests
    ]

    db.add_all(test_cases)
    db.commit()

    return {
        "message": "Contest created from template",
        "contest_id": contest.id,
        "test_cases_copied": len(test_cases)
    }

from app.models.classroom_participant import ClassroomParticipant

from fastapi.responses import StreamingResponse
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from io import BytesIO
@app.get("/classrooms/leaderboard/pdf")
def download_leaderboard_pdf(
    current_user: user.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # ---------- AUTH ----------
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers allowed")

    classroom = (
        db.query(Classroom)
        .filter(Classroom.teacher_id == current_user.id)
        .first()
    )

    if not classroom:
        raise HTTPException(status_code=400, detail="No active classroom")

    # ---------- FETCH LEADERBOARD ----------
    rows = (
        db.query(
            User.name,
            ClassroomParticipant.score
        )
        .join(ClassroomParticipant, ClassroomParticipant.student_id == User.id)
        .filter(ClassroomParticipant.classroom_id == classroom.id)
        .order_by(ClassroomParticipant.score.desc())
        .all()
    )

    # ---------- CREATE PDF ----------
    buffer = BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4

    y = height - 50

    # Title
    pdf.setFont("Helvetica-Bold", 16)
    pdf.drawString(50, y, "Classroom Leaderboard")
    y -= 25

    pdf.setFont("Helvetica", 10)
    pdf.drawString(50, y, f"Room Code: {classroom.room_code}")
    y -= 15
    pdf.drawString(50, y, f"Teacher: {current_user.name}")
    y -= 30

    # Table Header
    pdf.setFont("Helvetica-Bold", 11)
    pdf.drawString(50, y, "Rank")
    pdf.drawString(100, y, "Student Name")
    pdf.drawString(350, y, "Score")
    y -= 15

    pdf.setFont("Helvetica", 10)

    if not rows:
        pdf.drawString(50, y, "No students in classroom.")
    else:
        rank = 1
        for name, score in rows:
            if y < 50:
                pdf.showPage()
                y = height - 50
                pdf.setFont("Helvetica", 10)

            pdf.drawString(50, y, str(rank))
            pdf.drawString(100, y, name)
            pdf.drawString(350, y, str(score))
            y -= 15
            rank += 1

    pdf.save()
    buffer.seek(0)

    # ---------- RESPONSE ----------
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": "attachment; filename=leaderboard.pdf"
        },
    )

from app.models.user import User
from app.models.classroom import Classroom
from app.models.classroom_participant import ClassroomParticipant
from app.models.quiz import Quiz
from app.models.quiz_question import QuizQuestion
from app.models.quiz_submission import QuizSubmission
from app.models.contest import Contest
from app.models.contest_question import ContestQuestion
from app.models.contest_test_case import ContestTestCase
from app.models.contest_submission import ContestSubmission
from app.models.doubt import Doubt
@app.post("/clear-everything")
def clear_everything_api(
    password: str,
    db: Session = Depends(get_db),
):
    # 🔐 Hard-coded password check
    if password != "delete it bro":
        raise HTTPException(
            status_code=403,
            detail="Wrong password"
        )

    try:
        # -----------------------------
        # DELETE IN FK-SAFE ORDER
        # -----------------------------

        # Leaf tables
        db.query(QuizSubmission).delete()
        db.query(ContestSubmission).delete()
        db.query(ClassroomParticipant).delete()
        db.query(Doubt).delete()
        db.query(ContestTestCase).delete()
        db.query(ContestQuestion).delete()
        db.query(QuizQuestion).delete()

        # Mid-level
        db.query(Quiz).delete()
        db.query(Contest).delete()

        # Root
        db.query(Classroom).delete()

        # Finally USERS
        db.query(User).delete()

        db.commit()

        return {
            "message": "Everything deleted. Database is empty."
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
